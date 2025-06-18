  model Mod_Manifold
    // Model of Manifold
    // author: 	Bernt Lie
    //			University of South-Eastern Norway
	//			October 3, 2022
	//
	// Parameters
	constant Real PI = 3.151592654;
	//
	parameter Real ell_m = 500 "Length of manifold, m";
	parameter Real d_m = 0.1569 "Diameter of manifold, m";
	parameter Real A_m = PI*d_m^2/4 "Cross sectional area of manifold, m2";
	parameter Real V_m = A_m*ell_m "Volume of manifold, m3";
	parameter Real beta_T = 1/1.5e9 "Isothermal compressibility of fluid, 1/Pa";
	parameter Real p_beta_0 = 1e5 "Nominal fluid pressure, Pa";
	parameter Real rho_o = 900 "Density of oil, kg/m3";
	parameter Real rho_w = 1e3 "Density of water, kg/m3";
	
	
	// Initial state parameters
	parameter Real p_m0 = 50e5 "Initial manifold pressure, Pa";
	//
	// Declaring variables
	// -- differential variables
	Real p_m(start = p_m0, fixed = true) "Initializing manifold pressure, Pa";
	// -- depending on inputs
	Real rho_beta_0 "Mixture density, kg/m3";
	// -- algebraic variables
	Real rho_m "Manifold density, kg/m3";
	Real m_m "Manifold mass, kg";
	Real Vd_w "Inlet water flow rate to keep chi_w_m, m3/s";
	// 
	// -- input variables
	input Real rho_v_1 "Density vertical pipe 1, kg/m3";
	input Real rho_v_2 "Density vertical pipe 2, kg/m3";
	input Real chi_w_1 "Water cut vertical pipe 1, -";
	input Real chi_w_2 "Water cut vertical pipe 2, -";
	input Real chi_w_m "Water cut in manifold, -";
	input Real Vd_v_1 "Volumetric flow rate vertical pipe 1, m3/s";
	input Real Vd_v_2 "Volumetric flow rate vertical pipe 2, m3/s";
	input Real Vd_t "Volumetric flow rate to separator, m3/s";
	//input Real u_c "Choke valve opening, -";
  // Equations constituting the model
  equation
	// Balance equation
	der(p_m) = (rho_v_1*Vd_v_1 + rho_v_2*Vd_v_2 + rho_w*Vd_w
				- rho_m*Vd_t)/(rho_m*V_m*beta_T);
	// Algebraic equations
	// -- depending on inputs
	rho_beta_0 = chi_w_m*rho_w + (1-chi_w_m)*rho_o;
	// -- related to mass balance
	rho_m = rho_beta_0*exp(beta_T*(p_m-p_beta_0));
	Vd_w = ((chi_w_m - chi_w_1)*Vd_v_1 + (chi_w_m - chi_w_2)*Vd_v_2)/
				(1-chi_w_m);
	m_m = rho_m*V_m;
	//
  end Mod_Manifold;
